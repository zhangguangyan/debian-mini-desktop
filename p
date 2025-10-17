use std::{sync::Arc, time::Duration};

use pingora::prelude::*; // Server, ShutdownMode, Result, etc.
use pingora::listeners::tls::TlsSettings;
use pingora::services::background::{background_service, BackgroundService};

use pingora::proxy::{http_proxy_service, ProxyHttp, Session, UpstreamPeer};
use pingora::load_balancing::prelude::*; // LoadBalancer, Backend, RoundRobin, health_check

struct LB(Arc<LoadBalancer<RoundRobin>>);

#[async_trait::async_trait]
impl ProxyHttp for LB {
    type CTX = ();

    async fn upstream_peer(&self, _sess: &mut Session, _ctx: &mut Self::CTX)
        -> pingora::Result<UpstreamPeer>
    {
        let selected = self.0.select(b"", 256)
            .ok_or_else(|| pingora::Error::new_std(std::io::Error::new(
                std::io::ErrorKind::Other, "no healthy backends"
            )))?;

        Ok(UpstreamPeer::new(selected.addr(), selected.is_tls()))
    }
}

fn main() {
    // ---- Load balancer with two HTTPS origins ----
    let mut backends = vec![
        Backend::from_origin("https://origin-1.internal:443").unwrap(),
        Backend::from_origin("https://origin-2.internal:443").unwrap(),
    ];
    for b in &mut backends {
        b.connect_timeout = Some(Duration::from_secs(5));
        b.read_timeout = Some(Duration::from_secs(30));
        b.write_timeout = Some(Duration::from_secs(30));
        // b.set_sni("your.origin.hostname"); // if origin cert needs a specific SNI
    }

    let mut lb = LoadBalancer::try_from(backends).expect("lb create");
    lb.set_health_check(health_check::TcpHealthCheck::new());
    lb.health_check_frequency = Some(Duration::from_secs(5));

    let bg = background_service("health-checks", lb);
    let upstreams = bg.task(); // Arc<LoadBalancer<_>>

    // ---- Proxy service using the LB ----
    let mut server = Server::new(None).expect("server");
    server.bootstrap();

    let mut svc = http_proxy_service(&server.configuration, LB(upstreams));

    // ---- TLS listener (HTTPS only) ----
    let cert_path = "/etc/pki/tls/certs/server.crt";
    let key_path  = "/etc/pki/tls/private/key.pem";
    let mut tls = TlsSettings::intermediate(cert_path, key_path).expect("load cert/key");
    tls.enable_h2();

    // For testing without root, use 8443 instead of 443.
    svc.add_tls_with_settings("0.0.0.0:443", None, tls);

    server.add_service(svc);
    server.add_service(bg);
    server.run(ShutdownMode::Graceful);
}

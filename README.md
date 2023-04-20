# debian-mini-desktop

```
using System;
using System.ServiceModel.Channels;
using System.ServiceModel.Description;
using System.ServiceModel.Dispatcher;

public class LoggingMessageInspector : IClientMessageInspector
{
    public object BeforeSendRequest(ref Message request, IClientChannel channel)
    {
        Console.WriteLine("Outgoing Request:");
        Console.WriteLine(request.ToString());

        return null;
    }

    public void AfterReceiveReply(ref Message reply, object correlationState)
    {
        Console.WriteLine("Incoming Response:");
        Console.WriteLine(reply.ToString());
    }
}

public class LoggingEndpointBehavior : IEndpointBehavior
{
    public void ApplyClientBehavior(ServiceEndpoint endpoint, ClientRuntime clientRuntime)
    {
        clientRuntime.ClientMessageInspectors.Add(new LoggingMessageInspector());
    }

    public void ApplyDispatchBehavior(ServiceEndpoint endpoint, EndpointDispatcher endpointDispatcher)
    {
    }

    public void AddBindingParameters(ServiceEndpoint endpoint, BindingParameterCollection bindingParameters)
    {
    }

    public void Validate(ServiceEndpoint endpoint)
    {
    }
}
```
```
dotnet-svcutil http://localhost:1234/myservice?wsdl --outputDir MyService --use-string-overrides
```
```
public object BeforeSendRequest(ref Message request, IClientChannel channel)
{
    HttpRequestMessageProperty httpRequestMessage;
    object httpRequestMessageObject;
    if (request.Properties.TryGetValue(HttpRequestMessageProperty.Name, out httpRequestMessageObject))
    {
        httpRequestMessage = httpRequestMessageObject as HttpRequestMessageProperty;
        if (httpRequestMessage != null && string.IsNullOrEmpty(httpRequestMessage.Headers["SOAPAction"]))
        {
            httpRequestMessage.Headers["SOAPAction"] = "MySoapAction";
        }
    }
    else
    {
        httpRequestMessage = new HttpRequestMessageProperty();
        httpRequestMessage.Headers.Add("SOAPAction", "MySoapAction");
        request.Properties.Add(HttpRequestMessageProperty.Name, httpRequestMessage);
    }
    
    // log the outgoing request
    Console.WriteLine("Outgoing Request:");
    Console.WriteLine(request.ToString());

    return null;
}
```
```
var binding = new WSHttpBinding();
binding.Security.Mode = SecurityMode.Transport;

var endpoint = new EndpointAddress("https://example.com/MyService");

var client = new MyServiceClient(binding, endpoint);

using (var scope = new OperationContextScope(client.InnerChannel))
{
    var httpRequestProperty = new HttpRequestMessageProperty();
    httpRequestProperty.Headers.Add("CustomHeader", "CustomValue");
    OperationContext.Current.OutgoingMessageProperties[HttpRequestMessageProperty.Name] = httpRequestProperty;

    client.MyMethod();
}
```

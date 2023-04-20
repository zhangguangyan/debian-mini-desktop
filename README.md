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

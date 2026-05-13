namespace NexaPlan.API.Configuration;

public sealed class ExternalServicesOptions
{
    public const string SectionName = "ExternalServices";

    public MlServiceOptions MlService { get; init; } = new();
    public PayMongoServiceOptions PayMongo { get; init; } = new();
}

public sealed class MlServiceOptions
{
    /// <summary>Base URL only. Example: https://nexaplan-ml-engine.onrender.com</summary>
    public string BaseUrl { get; init; } = "";
}

public sealed class PayMongoServiceOptions
{
    /// <summary>Base URL only. Example: https://api.paymongo.com/v1/</summary>
    public string BaseUrl { get; init; } = "https://api.paymongo.com/v1/";
}

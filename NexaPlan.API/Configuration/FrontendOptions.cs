namespace NexaPlan.API.Configuration;

public sealed class FrontendOptions
{
    public const string SectionName = "Frontend";
    public const string CorsPolicyName = "AllowFrontend";

    public string BaseUrl { get; init; } = "http://localhost:5173";
    public string[] AllowedOrigins { get; init; } = [];
}

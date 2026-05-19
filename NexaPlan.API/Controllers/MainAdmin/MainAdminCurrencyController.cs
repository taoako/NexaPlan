using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using NexaPlan.API.Data;
using NexaPlan.API.DTOs;
using NexaPlan.API.Models;

namespace NexaPlan.API.Controllers.MainAdmin
{
    [ApiController]
    [Route("api/currency")]
    public class MainAdminCurrencyController : ControllerBase
    {
        private readonly IHttpClientFactory _http;
        private readonly IConfiguration _config;

        // Static cache — rates valid for 1 hour across all requests
        private static Dictionary<string, decimal> _rateCache = new();
        private static DateTime _cacheExpiry = DateTime.MinValue;

        public MainAdminCurrencyController(
            IHttpClientFactory http, IConfiguration config)
        { _http = http; _config = config; }

        // GET /api/currency/rates
        // Public endpoint — no auth required (rates are not sensitive)
        [HttpGet("rates")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRates()
        {
            if (_rateCache.Any() && DateTime.UtcNow < _cacheExpiry)
                return Ok(new { rates = _rateCache, source = "cached", base_ = "PHP" });

            try
            {
                var client = _http.CreateClient("MlService");
                var resp   = await client.GetAsync("/currency/rates");
                if (resp.IsSuccessStatusCode)
                {
                    var json  = await resp.Content.ReadFromJsonAsync<CurrencyRatesDto>();
                    _rateCache   = json?.Rates ?? FallbackRates();
                    _cacheExpiry = DateTime.UtcNow.AddHours(1);
                    return Ok(new { rates = _rateCache, source = json?.Source, base_ = "PHP" });
                }
            }
            catch { /* fall through to fallback */ }

            _rateCache   = FallbackRates();
            _cacheExpiry = DateTime.UtcNow.AddMinutes(15);
            return Ok(new { rates = _rateCache, source = "fallback", base_ = "PHP" });
        }

        private static Dictionary<string, decimal> FallbackRates() => new()
        {
            ["PHP"] = 1.0m,    ["USD"] = 0.0172m,  ["EUR"] = 0.0159m,
            ["GBP"] = 0.0136m, ["JPY"] = 2.63m,    ["SGD"] = 0.0233m,
            ["AUD"] = 0.0267m, ["CAD"] = 0.0237m,  ["CNY"] = 0.1249m,
            ["KRW"] = 23.54m,  ["THB"] = 0.623m,   ["MYR"] = 0.0804m,
            ["IDR"] = 280.5m,  ["INR"] = 1.438m,   ["HKD"] = 0.134m,
        };
    }

    public record CurrencyRatesDto(
        Dictionary<string, decimal> Rates,
        string Source,
        string Base);
}

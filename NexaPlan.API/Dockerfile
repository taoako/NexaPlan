# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ["NexaPlan.API.csproj", "./"]
RUN dotnet restore "NexaPlan.API.csproj"

# Copy everything else and build
COPY . .
RUN dotnet publish "NexaPlan.API.csproj" -c Release -o /app/publish

# Serve Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .

# Explicitly set the port so Render knows where to route traffic
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "NexaPlan.API.dll"]

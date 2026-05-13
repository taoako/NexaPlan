# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy the csproj and restore
COPY ["NexaPlan.API.csproj", "./"]
RUN dotnet restore "NexaPlan.API.csproj"

# Copy the rest of the code and build
COPY . .
RUN dotnet publish "NexaPlan.API.csproj" -c Release -o /app/publish

# Serve Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "NexaPlan.API.dll"]
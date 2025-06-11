package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"drone-planner/server/handlers"
)

func init() {
	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
	log.Println("Starting application initialization...")
}

func main() {
	// Force production environment in Render
	if os.Getenv("RENDER") == "true" {
		os.Setenv("GO_ENV", "production")
	}

	// Log environment
	env := os.Getenv("GO_ENV")
	if env == "" {
		env = "development"
	}
	log.Printf("Running in %s environment", env)

	// Load environment variables only in development
	if env == "development" {
		log.Println("Loading .env file for development environment")
		if err := godotenv.Load(".env.development"); err != nil {
			log.Printf("Warning: Error loading .env file: %v", err)
		}
	} else {
		log.Println("Running in production - using environment variables from system")
	}

	// Verify required environment variables
	requiredEnvVars := []string{"MONGODB_URI", "FRONTEND_URL", "SUPABASE_JWT_SECRET"}
	log.Println("Checking required environment variables...")
	for _, envVar := range requiredEnvVars {
		value := os.Getenv(envVar)
		if value == "" {
			log.Fatalf("Required environment variable %s is not set", envVar)
		}
		// Log first few characters of sensitive values
		if envVar == "MONGODB_URI" || envVar == "SUPABASE_JWT_SECRET" {
			if len(value) > 8 {
				log.Printf("%s is set (starts with: %s...)", envVar, value[:8])
			} else {
				log.Printf("%s is set (length: %d)", envVar, len(value))
			}
		} else {
			log.Printf("%s is set to: %s", envVar, value)
		}
	}

	// Connect to MongoDB
	log.Println("Connecting to MongoDB...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	mongoURI := os.Getenv("MONGODB_URI")
	log.Printf("MongoDB URI format check: %v", mongoURI != "")

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer client.Disconnect(ctx)

	// Ping the database
	log.Println("Pinging MongoDB...")
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatalf("Failed to ping MongoDB: %v", err)
	}
	log.Println("Successfully connected to MongoDB")

	// Get database and collection
	db := client.Database("drone_planner")
	flightsCollection := db.Collection("flights")
	log.Println("Database and collection initialized")

	// Create router
	r := mux.NewRouter()
	log.Println("Router created")

	// Create handlers
	flightHandler := handlers.NewFlightHandler(flightsCollection)
	log.Println("Handlers initialized")

	// API routes
	api := r.PathPrefix("/api").Subrouter()

	// Flight routes
	api.HandleFunc("/flights", flightHandler.CreateFlight).Methods("POST")
	api.HandleFunc("/flights", flightHandler.GetFlights).Methods("GET")
	api.HandleFunc("/flights/{id}", flightHandler.GetFlight).Methods("GET")
	api.HandleFunc("/flights/{id}", flightHandler.UpdateFlight).Methods("PUT")
	api.HandleFunc("/flights/{id}", flightHandler.DeleteFlight).Methods("DELETE")
	log.Println("API routes configured")

	// Add CORS middleware
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			frontendURL := os.Getenv("FRONTEND_URL")
			w.Header().Set("Access-Control-Allow-Origin", frontendURL)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Allow-Credentials", "true")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	})
	log.Println("CORS middleware configured")

	// Add auth middleware
	api.Use(handlers.AuthMiddleware)
	log.Println("Auth middleware configured")

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Printf("Frontend URL: %s", os.Getenv("FRONTEND_URL"))
	log.Printf("MongoDB connected: %s", mongoURI)
	log.Printf("Supabase JWT secret configured: %v", os.Getenv("SUPABASE_JWT_SECRET") != "")

	// Add a health check endpoint
	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "Server is healthy\nEnvironment: %s\nMongoDB: Connected\n", env)
	}).Methods("GET")
	log.Println("Health check endpoint added")

	log.Fatal(http.ListenAndServe(":"+port, r))
}

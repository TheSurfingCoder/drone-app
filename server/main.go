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

// responseWriter is a custom response writer that captures the status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func main() {
	// Force production environment in Render
	if os.Getenv("RENDER") == "true" {
		os.Setenv("GO_ENV", "production")
	}

	// Configure logging
	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
	log.SetOutput(os.Stdout)
	log.Println("Starting application initialization...")

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
	timezoneHandler := handlers.NewTimezoneHandler()
	log.Println("Handlers initialized")

	// API routes
	api := r.PathPrefix("/api").Subrouter()

	// Flight routes
	api.HandleFunc("/flights", flightHandler.CreateFlight).Methods("POST")
	api.HandleFunc("/flights", flightHandler.GetFlights).Methods("GET")
	api.HandleFunc("/flights/{id}", flightHandler.GetFlight).Methods("GET")
	api.HandleFunc("/flights/{id}", flightHandler.UpdateFlight).Methods("PUT")
	api.HandleFunc("/flights/{id}", flightHandler.DeleteFlight).Methods("DELETE")

	// Add auth middleware to API routes
	api.Use(handlers.AuthMiddleware)

	// Timezone routes (no auth required) - moved to different path to avoid /api subrouter
	r.HandleFunc("/timezone", timezoneHandler.GetTimezone).Methods("GET")
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

	// Add panic recovery middleware
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if err := recover(); err != nil {
					log.Printf("Recovered from panic: %v", err)
					http.Error(w, "Internal server error", http.StatusInternalServerError)
				}
			}()
			next.ServeHTTP(w, r)
		})
	})

	// Add request logging middleware
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			log.Printf("Started %s %s", r.Method, r.URL.Path)

			// Create a custom response writer to capture the status code
			rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

			next.ServeHTTP(rw, r)

			duration := time.Since(start)
			log.Printf("Completed %s %s %d %s in %v", r.Method, r.URL.Path, rw.statusCode, http.StatusText(rw.statusCode), duration)
		})
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Frontend URL esttablished")
	log.Printf("MongoDB connected")
	log.Printf("Supabase JWT secret configured")

	// Add a health check endpoint
	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "Server is healthy\nEnvironment: %s\nMongoDB: Connected\n", env)
	}).Methods("GET")
	log.Println("Health check endpoint added")

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	log.Printf("Server starting on port %s", port)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server error: %v", err)
	}

}

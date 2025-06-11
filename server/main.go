package main

import (
	"context"
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
	// Load .env file only in development
	if os.Getenv("GO_ENV") != "production" {
		err := godotenv.Load()
		if err != nil {
			log.Println("Error loading .env file:", err)
		}
	}
}

func main() {
	// Load environment variables
	env := os.Getenv("GO_ENV")
	if env == "" {
		env = "development"
	}
	if err := godotenv.Load(".env." + env); err != nil {
		log.Fatal("Error loading .env file")
	}

	// Connect to MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(os.Getenv("MONGODB_URI")))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(ctx)

	// Ping the database
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}

	// Get database and collection
	db := client.Database("drone_planner")
	flightsCollection := db.Collection("flights")

	// Create router
	r := mux.NewRouter()

	// Create handlers
	flightHandler := handlers.NewFlightHandler(flightsCollection)

	// API routes
	api := r.PathPrefix("/api").Subrouter()

	// Flight routes
	api.HandleFunc("/flights", flightHandler.CreateFlight).Methods("POST")
	api.HandleFunc("/flights", flightHandler.GetFlights).Methods("GET")
	api.HandleFunc("/flights/{id}", flightHandler.GetFlight).Methods("GET")
	api.HandleFunc("/flights/{id}", flightHandler.UpdateFlight).Methods("PUT")
	api.HandleFunc("/flights/{id}", flightHandler.DeleteFlight).Methods("DELETE")

	// Add CORS middleware
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", os.Getenv("FRONTEND_URL"))
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

	// Add auth middleware
	api.Use(handlers.AuthMiddleware)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

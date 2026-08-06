package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/pacco/tibiastatistics/backend/internal/auth"
	"github.com/pacco/tibiastatistics/backend/internal/handlers"
)

type Dependencies struct {
	AuthHandler       *handlers.AuthHandler
	TibiaHandler      *handlers.TibiaHandler
	WorldsHandler     *handlers.WorldsHandler
	HuntingHandler    *handlers.HuntingHandler
	SpritesHandler    *handlers.SpritesHandler
	BestiaryHandler   *handlers.BestiaryHandler
	CharactersHandler *handlers.CharactersHandler
	HuntTypesHandler  *handlers.HuntTypesHandler
	Tokens            *auth.TokenManager
	FrontendOrigin    string
}

func New(deps Dependencies) http.Handler {
	r := chi.NewRouter()

	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{deps.FrontendOrigin},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	r.Route("/api", func(r chi.Router) {
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", deps.AuthHandler.Register)
			r.Post("/login", deps.AuthHandler.Login)
			r.Post("/refresh", deps.AuthHandler.Refresh)
			r.Post("/logout", deps.AuthHandler.Logout)
		})

		r.Group(func(r chi.Router) {
			r.Use(auth.RequireAuth(deps.Tokens))

			r.Route("/tibia", func(r chi.Router) {
				r.Get("/highscores", deps.TibiaHandler.Highscores)
			})

			r.Route("/worlds", func(r chi.Router) {
				r.Get("/averages", deps.WorldsHandler.Averages)
				r.Get("/timeseries", deps.WorldsHandler.TimeSeries)
				r.Get("/hourly", deps.WorldsHandler.HourlyAverages)
			})

			r.Route("/hunting", func(r chi.Router) {
				r.Post("/sessions", deps.HuntingHandler.Import)
				r.Get("/sessions", deps.HuntingHandler.List)
				r.Delete("/sessions/{id}", deps.HuntingHandler.Delete)
				r.Patch("/sessions/{id}/character", deps.HuntingHandler.AssignCharacter)
				r.Patch("/sessions/{id}/hunt-type", deps.HuntingHandler.AssignHuntType)
			})

			r.Get("/sprites", deps.SpritesHandler.Resolve)
			r.Get("/bestiary", deps.BestiaryHandler.Resolve)

			r.Route("/characters", func(r chi.Router) {
				r.Post("/", deps.CharactersHandler.Create)
				r.Get("/", deps.CharactersHandler.List)
				r.Get("/{id}", deps.CharactersHandler.Get)
				r.Delete("/{id}", deps.CharactersHandler.Delete)
				r.Post("/{id}/refresh", deps.CharactersHandler.Refresh)
				r.Get("/{id}/snapshots", deps.CharactersHandler.Snapshots)
			})

			r.Route("/hunt-types", func(r chi.Router) {
				r.Post("/", deps.HuntTypesHandler.Create)
				r.Get("/", deps.HuntTypesHandler.List)
				r.Delete("/{id}", deps.HuntTypesHandler.Delete)
			})
		})
	})

	return r
}

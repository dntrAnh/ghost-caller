from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_env: str = "development"
    app_base_url: str = "http://localhost:8000"
    log_level: str = "INFO"

    # External APIs
    anthropic_api_key: str
    google_places_api_key: str
    elevenlabs_api_key: str
    elevenlabs_voice_id: str = "4eE49PxjZBNzAR0qirtr"
    elevenlabs_model_id: str = "eleven_turbo_v2_5"
    elevenlabs_stability: float = 0.65
    elevenlabs_similarity_boost: float = 0.7
    elevenlabs_style: float = 0.05
    elevenlabs_use_speaker_boost: bool = False
    deepgram_api_key: str = ""
    resend_api_key: str = ""

    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_jwt_secret: str

    # Twilio
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""
    twilio_send_digits_on_connect: str = "w0"

    # Google Places
    google_places_base_url: str = "https://places.googleapis.com/v1"

    # Anthropic
    anthropic_model: str = "claude-opus-4-6"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


settings = Settings()

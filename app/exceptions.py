from __future__ import annotations


class PromptStudioError(Exception):
    """Root of all domain errors raised by Prompt-Studio."""


class ConfigurationError(PromptStudioError, ValueError):
    pass


class HTTPError(PromptStudioError):
    status_code: int = 500
    detail: str = "Internal server error"

    def __init__(self, detail: str | None = None) -> None:
        super().__init__(detail or self.detail)
        if detail:
            self.detail = detail


class BadRequestError(HTTPError):
    status_code = 400
    detail = "Bad request"


class EmptyPromptError(BadRequestError):
    detail = "Empty prompt"


class UnknownModelError(BadRequestError):
    detail = "Unknown model_id"


class NotFoundError(HTTPError):
    status_code = 404
    detail = "Not found"


class LifespanStateError(PromptStudioError, RuntimeError):
    pass

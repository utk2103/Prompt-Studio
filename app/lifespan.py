from __future__ import annotations

from contextlib import asynccontextmanager
from enum import StrEnum
from typing import Awaitable, Callable

from fastapi import FastAPI

from app.exceptions import LifespanStateError
from app.logger import logger

Hook = Callable[[], Awaitable[None]]


class LifespanState(StrEnum):
    IDLE = "idle"
    STARTING = "starting"
    STARTED = "started"
    STOPPING = "stopping"
    STOPPED = "stopped"
    FAILED = "failed"


class LifespanManager:
    __slots__ = ("_state", "_startup", "_shutdown")

    def __init__(self) -> None:
        self._state = LifespanState.IDLE
        self._startup: list[Hook] = []
        self._shutdown: list[Hook] = []

    @property
    def state(self) -> LifespanState:
        return self._state

    def on_startup(self, fn: Hook) -> Hook:
        self._startup.append(fn)
        return fn

    def on_shutdown(self, fn: Hook) -> Hook:
        self._shutdown.append(fn)
        return fn

    async def start(self) -> None:
        if self._state is LifespanState.FAILED:
            raise LifespanStateError("Cannot restart a failed app")
        if self._state is not LifespanState.IDLE:
            raise LifespanStateError(f"Cannot start from {self._state}")
        self._state = LifespanState.STARTING
        try:
            for hook in self._startup:
                await hook()
        except Exception:
            self._state = LifespanState.FAILED
            logger.exception("Startup failed")
            raise
        self._state = LifespanState.STARTED

    async def stop(self) -> None:
        if self._state not in (LifespanState.STARTED, LifespanState.FAILED):
            raise LifespanStateError(f"Cannot stop from {self._state}")
        self._state = LifespanState.STOPPING
        for hook in reversed(self._shutdown):
            try:
                await hook()
            except Exception:
                logger.exception("Shutdown hook error (continuing)")
        self._state = LifespanState.STOPPED


lifespan_manager = LifespanManager()


@asynccontextmanager
async def lifespan(_: FastAPI):
    await lifespan_manager.start()
    try:
        yield
    finally:
        await lifespan_manager.stop()

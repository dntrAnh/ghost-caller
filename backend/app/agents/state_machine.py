from typing import Callable, Dict, Iterable, List, Optional, Set
from threading import Lock


class TransitionError(Exception):
    pass


class DomainStateMachine:
    """A tiny, thread-safe domain state machine.

    Features:
    - States are identified by strings.
    - Transitions are explicitly allowed (from -> to).
    - Register on_enter/on_exit callbacks per state.

    Callbacks receive two args: (from_state: str, to_state: str).

    Example:
        sm = DomainStateMachine(initial_state="idle")
        sm.add_transition("idle", "processing")
        sm.add_transition("processing", "completed")

        def on_enter_completed(from_s, to_s):
            print(f"entered {to_s} from {from_s}")

        sm.register_on_enter("completed", on_enter_completed)
        sm.transition_to("processing")
        sm.transition_to("completed")
    """

    def __init__(
        self,
        initial_state: str,
        states: Optional[Iterable[str]] = None,
        transitions: Optional[Dict[str, Iterable[str]]] = None,
    ) -> None:
        self._lock = Lock()
        self._states: Set[str] = set(states) if states is not None else set()
        self._states.add(initial_state)
        self._transitions: Dict[str, Set[str]] = {}
        if transitions:
            for src, dests in transitions.items():
                self._transitions[src] = set(dests)
                self._states.add(src)
                for d in dests:
                    self._states.add(d)

        self._state = initial_state
        self._on_enter: Dict[str, List[Callable[[str, str], None]]] = {}
        self._on_exit: Dict[str, List[Callable[[str, str], None]]] = {}

    @property
    def state(self) -> str:
        with self._lock:
            return self._state

    def add_state(self, state: str) -> None:
        with self._lock:
            self._states.add(state)

    def add_transition(self, from_state: str, to_state: str) -> None:
        with self._lock:
            self._states.add(from_state)
            self._states.add(to_state)
            self._transitions.setdefault(from_state, set()).add(to_state)

    def can_transition(self, to_state: str) -> bool:
        with self._lock:
            allowed = self._transitions.get(self._state, set())
            return to_state in allowed

    def transition_to(self, to_state: str) -> None:
        with self._lock:
            from_state = self._state
            if from_state == to_state:
                return  # no-op
            allowed = self._transitions.get(from_state)
            if allowed is None or to_state not in allowed:
                raise TransitionError(f"Invalid transition: {from_state} -> {to_state}")

            # call exit callbacks for from_state
            exit_callbacks = list(self._on_exit.get(from_state, []))

        # Callbacks called outside lock to avoid deadlocks if callbacks call back in
        for cb in exit_callbacks:
            try:
                cb(from_state, to_state)
            except Exception:
                # swallow errors in callbacks to keep state machine consistent
                pass

        with self._lock:
            self._state = to_state
            enter_callbacks = list(self._on_enter.get(to_state, []))

        for cb in enter_callbacks:
            try:
                cb(from_state, to_state)
            except Exception:
                pass

    def register_on_enter(self, state: str, callback: Callable[[str, str], None]) -> None:
        with self._lock:
            self._states.add(state)
            self._on_enter.setdefault(state, []).append(callback)

    def register_on_exit(self, state: str, callback: Callable[[str, str], None]) -> None:
        with self._lock:
            self._states.add(state)
            self._on_exit.setdefault(state, []).append(callback)


__all__ = ["DomainStateMachine", "TransitionError"]

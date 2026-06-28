import { useCallback, useEffect, useState } from "react";
import { abrirTurnoRemoto, guardarCierreTurno, sincronizarTurnoActual } from "../../../services/cierresTurno";
import { validateTurnoClose } from "../../../validations/turno.validation";
import {
  readTurnoAbierto,
  setTurnoAbierto,
  setTurnoFechaInicio,
  TURNO_ABIERTO_STORAGE_KEY
} from "../../pedidos/PedidosShared";
import type { FeedbackState } from "../PdvShared";

type Announce = (message: string, options?: Record<string, unknown>) => void;
type PlaySoundCue = (cue: "add" | "clear" | "decrease" | "error" | "remove" | "success") => void;

export function usePdvTurno({
  announce,
  onTurnoStateChange,
  playSoundCue,
  showFeedback
}: {
  announce: Announce;
  onTurnoStateChange: () => void;
  playSoundCue: PlaySoundCue;
  showFeedback: (feedback: FeedbackState) => void;
}) {
  const [isTurnoOpen, setIsTurnoOpen] = useState(() => readTurnoAbierto());

  useEffect(() => {
    void sincronizarTurnoActual()
      .then((turno) => {
        setTurnoAbierto(Boolean(turno));
        if (turno) setTurnoFechaInicio(turno.fechaInicio);
        setIsTurnoOpen(Boolean(turno));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === TURNO_ABIERTO_STORAGE_KEY) {
        setIsTurnoOpen(readTurnoAbierto());
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleToggleTurno = useCallback(async () => {
    if (isTurnoOpen) {
      const closeError = validateTurnoClose(isTurnoOpen);
      if (closeError) {
        showFeedback({ type: "error", title: "No se pudo cerrar el turno", message: closeError });
        return;
      }

      try {
        await guardarCierreTurno();
        setTurnoAbierto(false);
        setIsTurnoOpen(false);
        onTurnoStateChange();
        const message = "Turno cerrado correctamente.";
        showFeedback({ type: "success", title: "Turno cerrado", message });
        playSoundCue("success");
        announce(message, {
          priority: "high",
          dedupeKey: "pdv-turno-cerrado",
          cooldownMs: 2200,
          interrupt: true
        });
      } catch (error) {
        showFeedback({
          type: "error",
          title: "No se pudo cerrar el turno",
          message: error instanceof Error ? error.message : "No fue posible cerrar el turno"
        });
      }
      return;
    }

    try {
      const turno = await abrirTurnoRemoto();
      setTurnoAbierto(true);
      setTurnoFechaInicio(turno.fechaInicio);
      setIsTurnoOpen(true);
      onTurnoStateChange();
      const message = "Turno abierto correctamente.";
      announce(message, { priority: "high", dedupeKey: "pdv-turno-abierto", cooldownMs: 2200, interrupt: true });
    } catch (error) {
      showFeedback({
        type: "error",
        title: "No se pudo abrir el turno",
        message: error instanceof Error ? error.message : "No fue posible abrir el turno"
      });
    }
  }, [announce, isTurnoOpen, onTurnoStateChange, playSoundCue, showFeedback]);

  return {
    handleToggleTurno,
    isTurnoOpen
  };
}

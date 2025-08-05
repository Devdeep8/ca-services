import { useEffect } from "react";
import axios from "axios";

export function useWorkspaceCheck(setStep: (n: number) => void, setWorkspaceId: (id: string) => void) {
  useEffect(() => {
    async function checkWorkspace() {
      try {
        const res = await axios.get("/api/onboarding/check");
        if (res.data.workspaceId) {
          setWorkspaceId(res.data.workspaceId);
          setStep(2); // Skip to invite step
        }
      } catch (e) {
        // Ignore error, user likely has no workspace yet
      }
    }
    checkWorkspace();
  }, [setStep, setWorkspaceId]);
}
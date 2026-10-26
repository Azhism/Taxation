/* Submit is no longer its own page — step 3 is shown directly on the
   dashboard (see Dashboard.tsx + SubmitForm.tsx). Any direct hit on
   /dashboard/submit sends the user to the dashboard, which resumes them
   on their current step. */

import { Navigate } from "react-router-dom";

export default function Submit() {
  return <Navigate to="/dashboard" replace />;
}

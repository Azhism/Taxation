/* Review is no longer its own page — step 2 is shown directly on the
   dashboard (see Dashboard.tsx + ReviewContent.tsx). Any direct hit on
   /dashboard/review sends the user to the dashboard, which resumes them
   on their current step. */

import { Navigate } from "react-router-dom";

export default function Review() {
  return <Navigate to="/dashboard" replace />;
}

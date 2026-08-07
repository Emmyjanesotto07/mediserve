/*
  Simple operational endpoints for quick service checks and lightweight dashboard data.
*/

export const healthCheck = (req, res) => {
  res.status(200).json({
    success: true,
    service: "Mediserve",
    status: "ok",
    timestamp: new Date().toISOString()
  });
};

export const dashboardSummary = (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized"
    });
  }

  res.status(200).json({
    success: true,
    data: {
      totalPatients: 248,
      appointmentsToday: 36,
      doctorsOnDuty: 14,
      pendingLabs: 9
    }
  });
};

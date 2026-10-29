import { Request, Response, NextFunction } from "express";
import { can, type Capability } from "../rbac";

/**
 * Must run after authenticateAdmin (reads request.adminUser.role). Mirrors
 * the frontend's useCan()/RoleGuard, but this is the enforcement that
 * actually matters — the frontend check only decides what the UI shows.
 */
const requireCapability = (capability: Capability) => {
  return (request: Request, response: Response, next: NextFunction): any => {
    if (!can(request.adminUser?.role, capability)) {
      return response.status(403).json({
        status: "error",
        message: "You do not have permission to perform this action",
      });
    }
    return next();
  };
};

export default requireCapability;

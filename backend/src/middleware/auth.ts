import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { ProjectMember } from '../models/ProjectMember';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      projectRole?: string;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req.user = await User.findById(decoded.userId).select('-password');
    if (!req.user) return res.status(401).json({ error: 'User not found' });

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireProjectRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { projectId } = req.params;
    if (!projectId) return next();

    const member = await ProjectMember.findOne({
      project: projectId,
      user: req.user._id
    });

    if (!member || !allowedRoles.includes(member.role)) {
      return res.status(403).json({ error: `Access denied. Required role: ${allowedRoles.join(', ')}` });
    }

    req.projectRole = member.role;
    next();
  };
};

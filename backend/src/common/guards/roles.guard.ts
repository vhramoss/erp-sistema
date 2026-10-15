import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Acesso negado');

    const roleHierarchy = {
      [UserRole.PLATFORM_OWNER]: 4,
      [UserRole.SUPER_ADMIN]: 3,
      [UserRole.MANAGER]: 2,
      [UserRole.EMPLOYEE]: 1,
    };
    // Dono da plataforma tem acesso total a todos os tenants
    if (user.role === UserRole.PLATFORM_OWNER) return true;

    const userLevel = roleHierarchy[user.role as UserRole] || 0;
    const hasRole = requiredRoles.some((role) => userLevel >= roleHierarchy[role]);

    if (!hasRole) throw new ForbiddenException('Permissão insuficiente para esta ação');
    return true;
  }
}

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existingCompany = await this.prisma.company.findFirst({
      where: { OR: [{ cnpj: dto.cnpj }, { email: dto.companyEmail }] },
    });
    if (existingCompany) {
      throw new ConflictException('CNPJ ou email da empresa já cadastrado');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.adminEmail } });
    if (existingUser) {
      throw new ConflictException('Email de usuário já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const company = await this.prisma.company.create({
      data: {
        name: dto.companyName,
        cnpj: dto.cnpj,
        email: dto.companyEmail,
        users: {
          create: {
            name: dto.adminName,
            email: dto.adminEmail,
            password: hashedPassword,
            role: 'ADMIN',
          },
        },
      },
      include: { users: { select: { id: true, email: true, name: true, role: true } } },
    });

    const user = company.users[0];
    const tokens = await this.generateTokens(user.id, user.email, user.role, company.id);

    return {
      company: { id: company.id, name: company.name, cnpj: company.cnpj },
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { company: { select: { id: true, name: true, isActive: true } } },
    });

    if (!user) throw new UnauthorizedException('Credenciais inválidas');
    if (!user.isActive) throw new UnauthorizedException('Usuário inativo');
    if (!user.company.isActive) throw new UnauthorizedException('Empresa inativa');

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Credenciais inválidas');

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.companyId);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: { id: user.company.id, name: user.company.name },
      },
      ...tokens,
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.isActive || user.refreshToken !== dto.refreshToken) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      return this.generateTokens(user.id, user.email, user.role, user.companyId);
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Logout realizado com sucesso' };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        company: { select: { id: true, name: true, cnpj: true, plan: true, logo: true } },
      },
    });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');
    return user;
  }

  private async generateTokens(userId: string, email: string, role: string, companyId: string) {
    const payload = { sub: userId, email, role, companyId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    await this.prisma.user.update({ where: { id: userId }, data: { refreshToken } });

    return { accessToken, refreshToken };
  }
}

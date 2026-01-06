# NestJS Code Style - Guia Definitivo v3

> **PROPÓSITO**: Regras obrigatórias para projetos NestJS. Linguagem diretiva: SEMPRE, NUNCA, OBRIGATÓRIO.

---

## 1. ARQUITETURA DE DIRETÓRIOS

### Estrutura Raiz

```
project/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── auth/                    # [OBRIGATÓRIO] Autenticação
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   └── roles.guard.ts
│   │   ├── decorators/
│   │   │   └── roles.decorator.ts
│   │   ├── dtos/
│   │   └── enums/
│   │       └── role.enum.ts
│   ├── exceptions/              # [OBRIGATÓRIO] Filter global
│   │   └── all-exceptions.filter.ts
│   ├── utils/                   # [OBRIGATÓRIO] Helpers compartilhados
│   │   ├── paginated-dto.ts
│   │   ├── errors-dto.ts
│   │   └── constants.ts
│   ├── [feature]/               # Módulos de domínio
│   │   ├── [feature].module.ts
│   │   ├── [feature].controller.ts
│   │   ├── [feature].service.ts
│   │   ├── [feature].service.spec.ts
│   │   ├── dto/
│   │   │   ├── create-[feature].dto.ts
│   │   │   ├── update-[feature].dto.ts
│   │   │   └── [feature]-response.dto.ts
│   │   ├── entities/
│   │   │   └── [feature].entity.ts
│   │   └── enums/               # (opcional)
│   ├── file/                    # [INFRA] Upload
│   ├── emails/                  # [INFRA] Email
│   ├── notifications/           # [INFRA] Push
│   └── migrations/
├── test/
├── templates/                   # Templates email
├── .env.example
├── ormconfig.ts
├── tsconfig.json
└── docker-compose.yml
```

### Regras de Diretórios

- SEMPRE `kebab-case` para diretórios: `gift-lists/`, `tax-invoices/`
- SEMPRE plural para módulos: `users/`, `events/`
- SEMPRE singular para entities: `user.entity.ts`

---

## 2. NOMENCLATURA

### Arquivos

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Module | `[feature].module.ts` | `users.module.ts` |
| Controller | `[feature].controller.ts` | `users.controller.ts` |
| Service | `[feature].service.ts` | `users.service.ts` |
| Entity | `[name].entity.ts` | `user.entity.ts` |
| DTO criação | `create-[feature].dto.ts` | `create-user.dto.ts` |
| DTO update | `update-[feature].dto.ts` | `update-user.dto.ts` |
| DTO response | `[feature]-response.dto.ts` | `user-response.dto.ts` |
| Enum | `[name].enum.ts` | `role.enum.ts` |
| Guard | `[name].guard.ts` | `jwt-auth.guard.ts` |
| Strategy | `[name].strategy.ts` | `jwt.strategy.ts` |
| Teste | `[file].spec.ts` | `users.service.spec.ts` |

### Classes e Variáveis

```typescript
// PascalCase para classes
class UsersService {}
class CreateUserDto {}
class JwtAuthGuard {}

// camelCase para variáveis e métodos
const userWithSubscription = await this.findActive();
async findOneById(id: string) {}

// SCREAMING_SNAKE_CASE para enums
enum Role {
  ADMIN = "ADMIN",
  USER = "USER",
}

// snake_case para colunas do banco
@Column({ name: "created_at" })
createdAt: Date;
```

### Métodos Padrão

```typescript
// Controllers
create()      // POST
findAll()     // GET
findOne()     // GET :id
update()      // PATCH :id
delete()      // DELETE :id

// Services
create(dto)
findAll(query?)
findOneById(id)
findOneByEmail(email)
update(id, dto)
delete(id)
```

---

## 3. IMPORTS (Ordem Obrigatória)

```typescript
// 1. NestJS/framework
import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";

// 2. Internos do projeto (usar src/*)
import { UsersService } from "src/users/users.service";
import { Role } from "src/auth/enums/role.enum";

// 3. Relativos do mesmo módulo
import { CreateUserDto } from "./dto/create-user.dto";

// 4. Terceiros
import * as bcrypt from "bcryptjs";
```

SEMPRE usar `src/*` para imports cross-module, NUNCA paths relativos como `../../`.

---

## 4. ENTITIES

```typescript
import {
  Entity,
  Column,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm";
import { Exclude } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import * as bcrypt from "bcryptjs";
import { Role } from "src/auth/enums/role.enum";

@Entity({ name: "users" })
export class User {
  @ApiProperty({ example: "uuid-here" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty()
  @Index("idx_user_email")
  @Column({ name: "email", unique: true })
  email: string;

  @Exclude()
  @Column({ name: "password" })
  password: string;

  @ApiProperty({ enum: Role })
  @Column({ name: "role", type: "enum", enum: Role, default: Role.USER })
  role: Role;

  @ApiProperty({ example: true })
  @Column({ name: "status", default: true })
  status: boolean;

  @ApiProperty()
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relacionamentos
  @OneToMany(() => Event, (event) => event.user)
  events: Event[];

  @ManyToOne(() => Client, (client) => client.users, { onDelete: "CASCADE" })
  @JoinColumn({ name: "client_id" })
  client: Client;

  // Hooks - SEMPRE verificar se já está hasheado para evitar re-hash
  @BeforeInsert()
  @BeforeUpdate()
  private async hashPassword() {
    if (this.password && !this.password.startsWith("$2")) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}
```

### Regras de Entities

- SEMPRE usar `@Entity({ name: "nome_tabela" })` em snake_case
- SEMPRE usar `@Exclude()` em campos sensíveis (senha)
- SEMPRE criar índices em campos de busca frequente
- SEMPRE usar hooks para lógica automática (hash de senha)
- SEMPRE incluir `id`, `status`, `createdAt`, `updatedAt`

---

## 5. DTOs

### Create DTO

```typescript
export class CreateUserDto {
  @IsNotEmpty({ message: "Please provide a name." })
  @IsString()
  @ApiProperty({ description: "User's name", example: "John Doe" })
  name: string;

  @IsNotEmpty({ message: "Please provide an email." })
  @IsEmail({}, { message: "Invalid email format." })
  @ApiProperty({ description: "User's email", example: "john@example.com" })
  email: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ example: true })
  status?: boolean;

  @IsNotEmpty()
  @IsEnum(Role)
  @ApiProperty({ enum: Role })
  role: Role;
}
```

### Update DTO

```typescript
import { PartialType, OmitType } from "@nestjs/swagger";

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ["password"] as const)
) {}
```

### Response DTO (quando diferente da Entity)

```typescript
import { ApiProperty } from "@nestjs/swagger";

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty()
  createdAt: Date;

  // NUNCA incluir campos sensíveis (password, tokens, etc.)
}
```

### Regras de DTOs

- SEMPRE `@ApiProperty` com description e example
- SEMPRE validadores com mensagens customizadas
- SEMPRE `@IsOptional()` antes de outros decorators em campos opcionais
- NUNCA validadores em Response DTOs
- NUNCA incluir campos sensíveis em Response DTOs

---

## 6. SERVICE

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly fileService: FileService, // Injetar services, não repos
  ) {}

  async create(data: CreateUserDto): Promise<User> {
    await this.checkEmailExists(data.email);
    const entity = this.usersRepository.create(data);
    return this.usersRepository.save(entity);
  }

  async findAll(query?: FindAllQueryDto): Promise<PaginatedDto<User>> {
    const page = query?.page ?? 0;
    const limit = query?.limit ?? 10;

    const [data, total] = await this.usersRepository.findAndCount({
      skip: limit * page,
      take: limit,
      order: { createdAt: "DESC" },
    });

    return { total, limit, page, data };
  }

  async findOneById(id: string, relations?: string[]): Promise<User> {
    const entity = await this.usersRepository.findOne({
      where: { id },
      relations,
    });
    if (!entity) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return entity;
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const entity = await this.findOneById(id);
    Object.assign(entity, data);
    return this.usersRepository.save(entity);
  }

  async delete(id: string): Promise<void> {
    const entity = await this.findOneById(id);
    await this.usersRepository.remove(entity);
  }

  private async checkEmailExists(email: string): Promise<void> {
    const existing = await this.usersRepository.findOneBy({ email });
    if (existing) {
      throw new BadRequestException("Email already exists");
    }
  }
}
```

### Transações

```typescript
async complexOperation(): Promise<Entity> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    await queryRunner.manager.save(entity);
    await queryRunner.commitTransaction();
    return entity;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

---

## 7. CONTROLLER

SEMPRE aplicar Guards no nível de CLASSE para proteger todos os endpoints por padrão:

```typescript
@Controller({ path: "users", version: "1" })
@ApiTags("users")
@UseGuards(JwtAuthGuard, RolesGuard)  // Guards na CLASSE (padrão seguro)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Create user" })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, type: User })
  @ApiBadRequestResponse({ type: ErrorBadRequestDto })
  async create(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: "List all users" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async findAll(@Query() query): Promise<PaginatedDto<User>> {
    return this.usersService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get user by ID" })
  @ApiNotFoundResponse({ description: "User not found" })
  async findOne(@Param("id") id: string): Promise<User> {
    return this.usersService.findOneById(id);
  }

  @Patch(":id")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Update user" })
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, dto);
  }

  @Delete(":id")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Delete user" })
  async delete(@Param("id") id: string): Promise<void> {
    return this.usersService.delete(id);
  }
}
```

### Controller Público (exceção)

Para endpoints públicos, criar controller separado OU remover guards específicos:

```typescript
@Controller({ path: "auth", version: "1" })
@ApiTags("auth")
// SEM Guards globais - endpoints públicos
export class AuthController {
  @Post("login")
  @ApiOperation({ summary: "Login" })
  async login(@Body() dto: LoginDto): Promise<LoggedDto> {
    return this.authService.login(dto);
  }
}
```

### Regras de Controllers

- SEMPRE Guards na CLASSE (mais seguro - evita esquecer endpoint desprotegido)
- NUNCA lógica de negócio - apenas chamar services
- SEMPRE `@ApiOperation` em cada endpoint
- SEMPRE `@ApiBearerAuth` em rotas autenticadas

---

## 8. MODULE

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    FileModule,
    forwardRef(() => EventsModule), // Dependências circulares
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Exportar para outros módulos
})
export class UsersModule {}
```

---

## 9. AUTENTICAÇÃO

### JWT Strategy

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return { id: payload.id, email: payload.email, role: payload.role };
  }
}
```

### Roles Guard

```typescript
// decorators/roles.decorator.ts
export const ROLES_KEY = "roles";
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

---

## 10. EXCEPTION FILTER

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: any, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = {
      statusCode: httpStatus,
      message: exception.message || "Internal server error",
      error: exception.name,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
```

### Exceptions Padrão

```typescript
throw new BadRequestException("Validation failed");
throw new UnauthorizedException("Invalid credentials");
throw new ForbiddenException("Access denied");
throw new NotFoundException("Resource not found");
throw new ConflictException("Resource already exists");
```

---

## 11. PAGINAÇÃO

```typescript
import { ApiProperty } from "@nestjs/swagger";

export class PaginatedDto<T> {
  @ApiProperty()
  data: T[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 0 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}
```

---

## 12. CONFIGURAÇÕES

### main.ts

```typescript
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });

  app.use(bodyParser.json({ limit: "50mb" }));

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle("API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
```

### app.module.ts

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(ormconfig),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get("THROTTLE_TTL") || 60000,
          limit: config.get("THROTTLE_LIMIT") || 100,
        },
      ],
    }),
    AuthModule,
    UsersModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2021",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "baseUrl": "./",
    "paths": { "src/*": ["./src/*"] }
  }
}
```

---

## 13. SOLID

### S - Single Responsibility

- Controller: apenas HTTP (routing, validação entrada)
- Service: apenas lógica de negócio
- Repository: apenas acesso a dados

### O - Open/Closed

```typescript
// Criar interfaces para serviços externos
interface IStorageService {
  upload(file: any): Promise<{ url: string; key: string }>;
  delete(key: string): Promise<void>;
}
```

### D - Dependency Inversion

- SEMPRE injetar services de outros módulos
- NUNCA injetar repositories de outros módulos

```typescript
// ✅ CORRETO
constructor(
  @InjectRepository(User) private userRepo: Repository<User>,
  private eventsService: EventsService, // Service de outro módulo
) {}

// ❌ ERRADO
constructor(
  @InjectRepository(Event) private eventRepo: Repository<Event>, // Repo de outro módulo
) {}
```

---

## 14. CLEAN CODE

### Funções

- Máximo ~30 linhas por método
- Uma responsabilidade por função
- Nomes descritivos (verbo + substantivo)

### Early Return

```typescript
// ✅ CORRETO - Early return
async findOneById(id: string): Promise<User> {
  const user = await this.repo.findOne({ where: { id } });
  if (!user) {
    throw new NotFoundException(`User ${id} not found`);
  }
  return user;
}

// ❌ ERRADO - Aninhamento desnecessário
async findOneById(id: string): Promise<User> {
  const user = await this.repo.findOne({ where: { id } });
  if (user) {
    return user;
  } else {
    throw new NotFoundException(`User ${id} not found`);
  }
}
```

### Constantes

```typescript
// ✅ CORRETO
const MAX_LOGIN_ATTEMPTS = 5;
const PASSWORD_SALT_ROUNDS = 10;

// ❌ ERRADO (magic numbers)
if (attempts >= 5) {}
```

### Tipos

- NUNCA usar `any` - criar interfaces/DTOs
- SEMPRE tipos de retorno explícitos: `Promise<User>`

---

## 15. ANTI-PADRÕES (NUNCA FAZER)

```typescript
// 1. ❌ Lógica de negócio em controller
@Post()
async create(@Body() dto) {
  const hash = await bcrypt.hash(dto.password);
  return this.repo.save({ ...dto, password: hash });
}

// ✅ Delegar ao service
@Post()
async create(@Body() dto) {
  return this.usersService.create(dto);
}

// 2. ❌ Erro silencioso
try {
  await this.doSomething();
} catch (e) {}

// ✅ Sempre tratar ou logar
try {
  await this.doSomething();
} catch (e) {
  throw new InternalServerErrorException("Operation failed");
}

// 3. ❌ any sem justificativa
async find(data: any): Promise<any>

// ✅ Tipar corretamente
async find(id: string): Promise<User>

// 4. ❌ Módulo sem export
@Module({
  providers: [UsersService],
})

// ✅ Exportar services necessários
@Module({
  providers: [UsersService],
  exports: [UsersService],
})

// 5. ❌ Callback não-awaited
ejs.renderFile(path, { data }, (err, html) => {
  formatedHtml = html;
});
return formatedHtml; // undefined!

// ✅ Usar promisify ou versão async
const html = await ejs.renderFile(path, { data });
return html;

// 6. ❌ indexOf com > 0 em vez de >= 0
const index = array.indexOf(item);
if (index > 0) {} // Ignora índice 0!

// ✅ Usar >= 0
if (index >= 0) {}

// 7. ❌ Re-hash de senha já hasheada
@BeforeUpdate()
async hashPassword() {
  this.password = await bcrypt.hash(this.password, 10);
}

// ✅ Verificar se já está hasheado
@BeforeUpdate()
async hashPassword() {
  if (this.password && !this.password.startsWith("$2")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
}

// 8. ❌ Guards apenas no método (risco de esquecer)
@Controller("users")
export class UsersController {
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {}

  @Get(":id")
  // Esqueceu o guard - endpoint desprotegido!
  findOne() {}
}

// ✅ Guards na CLASSE
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  @Get()
  findAll() {} // Protegido automaticamente

  @Get(":id")
  findOne() {} // Protegido automaticamente
}

// 9. ❌ Injetar repositório de outro módulo
constructor(
  @InjectRepository(Event) private eventRepo: Repository<Event>,
) {}

// ✅ Injetar service de outro módulo
constructor(
  private eventsService: EventsService,
) {}
```

---

## 16. TESTES

```typescript
describe("UsersService", () => {
  let service: UsersService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe("create", () => {
    it("should create user successfully", async () => {
      const dto = { name: "Test", email: "test@test.com" };
      mockRepository.findOneBy.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(dto);
      mockRepository.save.mockResolvedValue({ id: "1", ...dto });

      const result = await service.create(dto);

      expect(result.id).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it("should throw if email exists", async () => {
      mockRepository.findOneBy.mockResolvedValue({ id: "1" });

      await expect(service.create({ email: "exists@test.com" }))
        .rejects.toThrow(BadRequestException);
    });
  });
});
```

---

## 17. CHECKLIST

### Antes de criar um módulo

- [ ] Nome em kebab-case e plural (`users`, `tax-invoices`)
- [ ] Estrutura: `dto/`, `entities/`, `enums/`
- [ ] Module exporta o Service

### Antes de criar um endpoint

- [ ] `@ApiOperation` com summary
- [ ] `@ApiResponse` para cada status
- [ ] Guards na CLASSE (não no método)
- [ ] `@Roles` onde necessário

### Antes de criar um service

- [ ] `@InjectRepository` apenas do próprio módulo
- [ ] Injetar services (não repos) de outros módulos
- [ ] Métodos CRUD padrão
- [ ] Tratamento de erros com exceptions NestJS

### Antes de criar uma entity

- [ ] `@Exclude()` em campos sensíveis
- [ ] hashPassword verifica `!startsWith("$2")`
- [ ] Índices em campos de busca frequente
- [ ] Campos: `id`, `status`, `createdAt`, `updatedAt`

### Antes de commit

- [ ] Testes passando
- [ ] Sem `console.log`
- [ ] Sem `any` sem justificativa
- [ ] Sem credenciais hardcoded

---

## 18. DEPENDÊNCIAS

```json
{
  "@nestjs/common": "^10.x",
  "@nestjs/config": "^3.x",
  "@nestjs/typeorm": "^10.x",
  "@nestjs/jwt": "^10.x",
  "@nestjs/passport": "^10.x",
  "@nestjs/swagger": "^7.x",
  "@nestjs/throttler": "^6.x",
  "typeorm": "^0.3.x",
  "class-validator": "^0.14.x",
  "class-transformer": "^0.5.x",
  "passport-jwt": "^4.x",
  "bcryptjs": "^2.x"
}
```

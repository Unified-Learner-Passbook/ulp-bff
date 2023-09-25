import { Module } from '@nestjs/common';
import { SSOModule } from './sso/sso.module';
import { CredentialsModule } from './credentials/credentials.module';
import { SchoolModule } from './school/school.module';
import { ClientModule } from './client/client.module';
import { PortalModule } from './portal/portal.module';
import { SbrcapiModule } from './sbrcapi/sbrcapi.module';
import { InstructorModule } from './instructor/instructor.module';
import { IssuerModule } from './issuer/issuer.module';
import { LearnerModule } from './learner/learner.module';
import { SchemaModule } from './schema/schema.module';
import { GrievanceModule } from './grievance/grievance.module';

//call env variable
import { ConfigModule } from '@nestjs/config';
import { CredService } from './services/cred/cred.service';
import { SbrcService } from './services/sbrc/sbrc.service';
import { HttpModule, HttpModuleOptions } from '@nestjs/axios';
import { AadharService } from './services/aadhar/aadhar.service';
import { KeycloakService } from './services/keycloak/keycloak.service';
import { UdiseService } from 'src/services/udise/udise.service';
import { TelemetryService } from './services/telemetry/telemetry.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './services/users/users.module';
import { ClaimAttestModule } from './claimAttest/claimAttest.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    //HttpModule,
    {
      ...HttpModule.register({}),
      global: true,
    },
    SSOModule,
    CredentialsModule,
    SchoolModule,
    ClientModule,
    PortalModule,
    SbrcapiModule,
    InstructorModule,
    IssuerModule,
    LearnerModule,
    SchemaModule,
    // TypeOrmModule.forRoot({
    //   type: 'postgres',
    //   host: '64.227.129.71',
    //   port: 5432,
    //   username: 'postgres',
    //   password: '4E3k%nC*AG',
    //   database: 'middleware_db',
    //   entities: [__dirname + '/**/*.entity{.ts,.js}'],
    //   synchronize: true,
    //   logging: true,
    // }),
    //UsersModule,
    ClaimAttestModule,
    GrievanceModule,
  ],
  providers: [
    CredService,
    SbrcService,
    AadharService,
    KeycloakService,
    UdiseService,
    TelemetryService,
  ],
})
export class AppModule {}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSOModule = void 0;
const common_1 = require("@nestjs/common");
const sso_controller_1 = require("./sso.controller");
const sso_services_1 = require("./sso.services");
const nest_keycloak_connect_1 = require("nest-keycloak-connect");
const core_1 = require("@nestjs/core");
let SSOModule = class SSOModule {
};
SSOModule = __decorate([
    (0, common_1.Module)({
        imports: [
            nest_keycloak_connect_1.KeycloakConnectModule.register({
                authServerUrl: 'https://ulp.uniteframework.io/auth',
                realm: 'sunbird-rc',
                clientId: 'ulp-user',
                secret: '2630e6f7-4a40-4eb3-ad8b-f23a72114fa8',
            }),
        ],
        controllers: [sso_controller_1.SSOController],
        providers: [
            sso_services_1.SSOService,
            {
                provide: core_1.APP_GUARD,
                useClass: nest_keycloak_connect_1.ResourceGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: nest_keycloak_connect_1.RoleGuard,
            },
        ],
    })
], SSOModule);
exports.SSOModule = SSOModule;
//# sourceMappingURL=sso.module.js.map
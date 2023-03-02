"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSOController = exports.keycloakConfig = void 0;
const common_1 = require("@nestjs/common");
const sso_services_1 = require("./sso.services");
const keycloak_admin_1 = require("keycloak-admin");
exports.keycloakConfig = {
    realm: 'sunbird-rc',
    clientId: 'ulp-user',
    clientSecret: '2630e6f7-4a40-4eb3-ad8b-f23a72114fa8',
    baseUrl: 'https://ulp.uniteframework.io/auth',
};
let SSOController = class SSOController {
    constructor(ssoService) {
        this.ssoService = ssoService;
    }
    getUser() {
        return `${this.ssoService.getHello()} from user`;
    }
    async registerStudent(username, name) {
        const kcAdminClientLocal = new keycloak_admin_1.default({
            baseUrl: exports.keycloakConfig.baseUrl,
            realmName: exports.keycloakConfig.realm,
        });
        await kcAdminClientLocal.auth({
            grantType: 'client_credentials',
            clientId: exports.keycloakConfig.clientId,
            clientSecret: exports.keycloakConfig.clientSecret,
        });
        return this.ssoService.registerStudent(username, name);
    }
};
__decorate([
    (0, common_1.Get)('/user'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SSOController.prototype, "getUser", null);
__decorate([
    (0, common_1.Post)('/student/register'),
    __param(0, (0, common_1.Body)('username')),
    __param(1, (0, common_1.Body)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SSOController.prototype, "registerStudent", null);
SSOController = __decorate([
    (0, common_1.Controller)('sso'),
    __metadata("design:paramtypes", [sso_services_1.SSOService])
], SSOController);
exports.SSOController = SSOController;
//# sourceMappingURL=sso.controller.js.map
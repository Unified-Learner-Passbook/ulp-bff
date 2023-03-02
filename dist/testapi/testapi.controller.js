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
exports.TestAPIController = void 0;
const common_1 = require("@nestjs/common");
const testapi_services_1 = require("./testapi.services");
let TestAPIController = class TestAPIController {
    constructor(testapiService) {
        this.testapiService = testapiService;
    }
    getAPI() {
        return this.testapiService.getAPI();
    }
    getAPIID(getId) {
        return this.testapiService.getAPIID(getId);
    }
    postAPIID(postId) {
        return this.testapiService.postAPIID(postId);
    }
};
__decorate([
    (0, common_1.Get)('getapi'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], TestAPIController.prototype, "getAPI", null);
__decorate([
    (0, common_1.Get)('getapi/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestAPIController.prototype, "getAPIID", null);
__decorate([
    (0, common_1.Post)('postapi'),
    __param(0, (0, common_1.Body)('postId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestAPIController.prototype, "postAPIID", null);
TestAPIController = __decorate([
    (0, common_1.Controller)('testapi'),
    __metadata("design:paramtypes", [testapi_services_1.TestAPIService])
], TestAPIController);
exports.TestAPIController = TestAPIController;
//# sourceMappingURL=testapi.controller.js.map
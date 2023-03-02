"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestAPIService = void 0;
const common_1 = require("@nestjs/common");
let TestAPIService = class TestAPIService {
    getAPI() {
        return { statusCode: 200, message: 'Test API is working', error: '' };
    }
    getAPIID(getId) {
        return { statusCode: 200, message: 'Get ID is ' + getId, error: '' };
    }
    postAPIID(postId) {
        if (postId) {
            return { statusCode: 200, message: 'Post ID is ' + postId, error: '' };
        }
        else {
            return {
                statusCode: 200,
                message: 'Post ID is not getting Posted' + postId,
                error: '',
            };
        }
    }
};
TestAPIService = __decorate([
    (0, common_1.Injectable)()
], TestAPIService);
exports.TestAPIService = TestAPIService;
//# sourceMappingURL=testapi.services.js.map
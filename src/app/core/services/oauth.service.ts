import {Inject, Injectable} from '@angular/core';
import {ApiConfig} from '../models/api-config';
import 'rxjs/add/operator/map';

import {CommonUtil} from '../utilities/common.util';
import {AuthService} from './auth.service';
import {AuthHelper} from './auth.helper';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {OauthToken} from '../models/oauth-token';

@Injectable()
export class OAuthService implements AuthService {

  constructor(private http: HttpClient,
              @Inject('api.config') private apiConfig: ApiConfig,
              private authHelper: AuthHelper) {
  }

  getServiceUrl(): string {
    return CommonUtil.getApiUrl('OAUTH_SERVICE_URL', this.apiConfig);
  }

  login(username: string, password: string) {
    const data = 'grant_type=password&username=' + username + '&password=' + password;
    let headers: HttpHeaders = new HttpHeaders({'Content-Type': 'application/x-www-form-urlencoded'});
    headers = this.authHelper.addHeaderAuthorization(headers);

    return this.http.post(this.getServiceUrl(), data, {headers: headers}).map((userData: OauthToken) => {
      const expiresIn = userData.expires_in || this.apiConfig.timeExpired;

      // add access token when mock environment
      if (this.apiConfig.apiEnv === 'mock') {
        userData.access_token = '12345-67890-5555';
        userData.token_type = 'bearer';
      }

      // login successful if there's a jwt token in the response
      if (userData.access_token) {
        AuthHelper.addUserInfo(username, expiresIn);
        AuthHelper.addTokenInfo(userData, expiresIn);
      }

      return userData;
    });
  }

  logout() {
    // remove user session info
    AuthHelper.clearCookies();
  }
}

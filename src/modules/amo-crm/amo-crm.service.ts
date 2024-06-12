import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AMOCRM_CLIENT_ID,
  AMOCRM_SECRET,
  AMOCRM_BASE_URL,
} from './amo-crm-access';
import * as fs from 'fs';
import * as path from 'path';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class AmoCRMService {
  async getLeads(query?: string) {
    // Gets results until page request fail
    // then returns list of elements on pages
    if (query && query.length < 3) {
      throw new BadRequestException('Query is too short');
    }
    const list = [];
    let page = 1;
    while (true) {
      try {
        let url: string;
        if (query) {
          url = `${AMOCRM_BASE_URL}/api/v4/leads?with=contacts&page=${page}&query=${query}`;
        } else {
          url = `${AMOCRM_BASE_URL}/api/v4/leads?with=contacts&page=${page}`;
        }
        const tokenPair = await this.getOrUpdateAccess();
        const accessToken = tokenPair.access_token;
        const result = await this.getRequest(url, { accessToken });
        list.push(result);
        page += 1;
      } catch (e) {
        console.log(e);
        break;
      }
    }
    return list;
  }

  async getTokenPairByCode(code: string): Promise<JwtPayload> {
    // Gets the first access\refresh token pair
    // by one-time authorization code
    // then saves and returns it
    const url = `${AMOCRM_BASE_URL}/oauth2/access_token`;
    const body = {
      client_id: AMOCRM_CLIENT_ID,
      client_secret: AMOCRM_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: AMOCRM_BASE_URL,
    };
    const tokenPair = await this.postRequest(url, body);
    this.saveToken(tokenPair);
    return tokenPair;
  }

  private readTokenPair(): JwtPayload {
    const rootFolder = path.resolve(__dirname, '..', '..', '..');
    const filePath = path.resolve(rootFolder, 'tokens.json');
    const fileData = fs.readFileSync(filePath, 'utf-8');
    const tokens = JSON.parse(fileData);
    return tokens;
  }

  private saveToken(token: JwtPayload): void {
    token = <JwtPayload>{ ...token, createdAt: new Date() };
    const rootFolder = path.resolve(__dirname, '..', '..', '..');
    const filePath = path.resolve(rootFolder, 'tokens.json');
    const content = JSON.stringify(token);
    try {
      fs.writeFileSync(filePath, content);
    } catch (e) {
      console.error(e);
    }
  }

  private async getOrUpdateAccess(): Promise<JwtPayload> {
    // if the saved token is still valid -> returns it
    // else -> gets another one from API
    try {
      const savedTokenPair = this.readTokenPair();
      const createdAt = new Date(savedTokenPair.createdAt).getTime();
      const now = new Date().getTime();
      if (now - createdAt < savedTokenPair.expires_in) {
        return savedTokenPair;
      }
    } catch (e) {
      console.error(e);
    }

    const url = `${AMOCRM_BASE_URL}/oauth2/access_token`;
    const body = {
      client_id: AMOCRM_CLIENT_ID,
      client_secret: AMOCRM_SECRET,
      grant_type: 'refresh_token',
      refresh_token: this.readTokenPair().refresh_token,
      redirect_uri: AMOCRM_BASE_URL,
    };
    const tokenPair = await this.postRequest(url, body);
    this.saveToken(tokenPair);
    return tokenPair;
  }

  private async getRequest(
    url: string,
    params: { accessToken?: string; page?: number },
  ): Promise<any> {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          Authorization: params?.accessToken
            ? `Bearer ${params.accessToken}`
            : undefined,
        },
      });
      return response.json();
    } catch (e) {}
  }

  private async postRequest(url: string, body: object): Promise<any> {
    try {
      const response = await fetch(url, {
        method: 'post',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const answer = await response.json();
      return answer;
    } catch (e) {
      console.error(e);
    }
  }
}

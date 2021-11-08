import {
  HttpVerb,
  IPlugin,
  IPluginRouteRequest,
  MissingSettingError,
  Plugin,
  PluginRestExtension,
  PluginScope,
  PluginSetting,
  PluginType,
  RestServerError,
  Setting,
  SettingsManager,
} from '../../core';

import { IRequestPayload, IResult, WebClient } from './webclient.mock';

@Plugin({
  name: 'BitbucketExplorer',
  scope: PluginScope.SERVICE,
  type: PluginType.REPOSITORIES,
})
export default class BitbucketExplorer implements IPlugin {
  @PluginSetting({ name: 'username', displayName: 'Username' }) username: string;
  @PluginSetting({ name: 'password', displayName: 'Password' }) password: string;
  @PluginSetting({ name: 'team_id', displayName: 'Team ID' }) teamID: string;

  webClient: WebClient;

  async init(orgId: string, settingId: string): Promise<void> {
    console.log(`Initializing ${ this.constructor.name } plugin`);
    await this.loadSettings(orgId, settingId);
    this.webClient = new WebClient(this.username, this.password, this.teamID);
  }

  async routeRequest(request: IPluginRouteRequest): Promise<any> {
    try {
      return await this[request.pluginMethod](request.queryParams, request.body);
    } catch (error) {
      console.log(`The ${ request.httpVerb } method ${ request.pluginMethod } is not recognized by ${ this.constructor.name } plugin.`);
      throw error;
    }
  }

  async gatherListRepos(body: IRequestPayload): Promise<IResult> {
    try {
      return await this.webClient.getList(body);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  @PluginRestExtension({ name: 'listRepositories', httpVerb: HttpVerb.GET })
  async listRepositories(queryParams: any, body: IRequestPayload): Promise<IResult> {
    try {
      return await this.gatherListRepos(body as IRequestPayload);
    } catch (error) {
      throw new RestServerError(
        `${ this.constructor.name } listRepositories error: `,
        `${ error }`,
      );
    }
  }

  private async loadSettings(orgId: string, settingId: string): Promise<void> {
    const result: Setting = await SettingsManager.getPluginSettingsById(orgId, settingId);
    const config = result.configuration;

    const _username = config.find((d) => d.name === 'username');
    if (!_username) {
      throw new MissingSettingError(`${ this.constructor.name } Username missing from provider settings.`);
    }
    this.username = _username.value;

    const _password = config.find((d) => d.name === 'password');
    if (!_password) {
      throw new MissingSettingError(`${ this.constructor.name } Password missing from provider settings.`);
    }
    this.password = _password.value;

    const _teamID = config.find((d) => d.name === 'team_id');
    if (!_teamID) {
      throw new MissingSettingError(`${ this.constructor.name } Team ID missing from provider settings.`);
    }
    this.teamID = _teamID.value;
  }

}

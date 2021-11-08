import BitbucketExplorer from './bitbuckets.plugin';
import { WebClient } from './webclient.mock';

let configuration = [];

jest.mock('./webclient.mock');
jest.mock('../../core/settings.manager', () => {
  return {
    SettingsManager: {
      getPluginSettingsById: async () => {
        return Promise.resolve({ configuration });
      },
    },
  };
});

describe('BitbucketExplorer', () => {
  let service;

  beforeEach(() => {
    service = new BitbucketExplorer();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('`init` should load settings and initialize WebClient', () => {
    expect.assertions(4);
    expect(service.webClient).toBeUndefined();
    service.username = 'username';
    service.password = 'password';
    service.teamID = 'teamID';
    const spy = jest.spyOn(service, 'loadSettings').mockImplementation(jest.fn);

    return service.init('org_id', 'setting_id').then(() => {
      expect(service.webClient).toBeDefined();
      expect(spy).toHaveBeenCalledWith('org_id', 'setting_id');
      expect(WebClient).toHaveBeenCalledWith(service.username, service.password, service.teamID);
    });
  });

  describe('`routeRequest`', () => {
    it('should call provided method and return in result if it exists', () => {
      expect.assertions(2);
      const request = {
        pluginMethod: 'listRepositories',
        queryParams: { a: 1 },
        body: { pagelen: 1 },
      };
      const answer = { b: 2 };
      const spy = jest.spyOn(service, 'listRepositories').mockImplementation(() => answer);

      return service.routeRequest(request).then((result) => {
        expect(result).toEqual(answer);
        expect(spy).toHaveBeenCalledWith(request.queryParams, request.body);
      });
    });

    it('should call provided method and return in result if it exists', () => {
      expect.assertions(2);
      const request = {
        pluginMethod: 'someWrongMethod',
        queryParams: { a: 1 },
        body: { pagelen: 1 },
      };
      const spy = jest.spyOn(global.console, 'log').mockImplementation(() => {
      });
      return service.routeRequest(request).catch((e) => {
        expect(e).toEqual(expect.any(Error));
        expect(spy).toHaveBeenCalledWith('The undefined method someWrongMethod is not recognized by BitbucketExplorer plugin.');
      });
    });
  });

  describe('`gatherListRepos`', () => {
    it('should call webClient.getList', () => {
      expect.assertions(2);
      const answer = { c: 3 };
      const getList = jest.fn(() => answer);
      service.webClient = { getList } as any;
      return service.gatherListRepos().then((result) => {
        expect(getList).toHaveBeenCalled();
        expect(result).toEqual(answer);
      });
    });

    it('should throw error if webClient returns error and write to console.log', () => {
      expect.assertions(3);
      const getList = jest.fn(() => Promise.reject(new Error()));
      const spy = jest.spyOn(global.console, 'log').mockImplementation(() => {
      });
      service.webClient = { getList } as any;
      return service.gatherListRepos().catch((e) => {
        expect(getList).toHaveBeenCalled();
        expect(e).toEqual(expect.any(Error));
        expect(spy).toHaveBeenCalled();
      });
    });
  });

  describe('`listRepositories`', () => {
    it('should call gatherListRepos', () => {
      expect.assertions(1);
      const spy = jest.spyOn(service, 'gatherListRepos').mockImplementation(jest.fn);
      return service.listRepositories().then(() => {
        expect(spy).toHaveBeenCalled();
      });
    });

    it('should throw error if gatherListRepos returns error and write to console.log', () => {
      expect.assertions(1);
      jest.spyOn(service, 'gatherListRepos').mockReturnValue(Promise.reject(new Error()));
      return service.listRepositories().catch((e) => {
        expect(e).toEqual(expect.any(Error));
      });
    });
  });

  describe('`loadSettings`', () => {
    beforeEach(() => {
      configuration = [
        { name: 'username', value: 'user' },
        { name: 'password', value: 'password123' },
        { name: 'team_id', value: 'team' },
      ];
    });

    it('should assign settings to service properties', () => {
      expect.assertions(6);
      expect(service.username).toBeUndefined();
      expect(service.password).toBeUndefined();
      expect(service.teamID).toBeUndefined();
      return service.loadSettings().then(() => {
        expect(service.username).toEqual('user');
        expect(service.password).toEqual('password123');
        expect(service.teamID).toEqual('team');
      });
    });

    it('should return an error if one of attributes is missed (name)', () => {
      configuration[0].name = 'something';
      return service.loadSettings().catch((e) => {
        expect(e).toEqual(expect.any(Error));
      });
    });

    it('should return an error if one of attributes is missed (password)', () => {
      configuration[1].name = 'something';
      return service.loadSettings().catch((e) => {
        expect(e).toEqual(expect.any(Error));
      });
    });

    it('should return an error if one of attributes is missed (teamID)', () => {
      configuration[2].name = 'something';
      return service.loadSettings().catch((e) => {
        expect(e).toEqual(expect.any(Error));
      });
    });
  });
});

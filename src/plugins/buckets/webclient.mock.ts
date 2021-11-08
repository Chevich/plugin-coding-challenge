export class WebClient {
  constructor(
    public username: string,
    public password: string,
    public teamID: string) {
  };

  async getList(body: IRequestPayload): Promise<IResult> {
    // https://api.bitbucket.org/2.0/repositories/{{teamID}}
    // response example : {"pagelen": 10, "values": [], "page": 1, "size": 0}
    // Basic Auth by username & password

    console.log(`List "${ this.teamID }" repos`);
    return {
      values: [],
      ok: true,
    };
  }
}

export interface IResult {
  values: IRepo[];
  ok: boolean;
}

export interface IRequestPayload {
  pagelen?: number;
  fields?: string;
}

interface IRepo {
  scm: string;
  website: string;
  name: string;
  uuid: string;
  slug: string;
}

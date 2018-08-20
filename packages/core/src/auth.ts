import { DateString, Serializable } from "./encoding";
import { PublicKey, PrivateKey } from "./crypto";
import { Storable } from "./storage";
import { StoreID } from "./data";
import { DeviceInfo } from "./platform";

export type AccountID = string;
export type SessionID = string;
export type DeviceID = string;

export class Device implements Serializable, DeviceInfo {
    id: string = "";
    platform: string = "";
    osVersion: string = "";
    appVersion: string = "";
    manufacturer?: string;
    model?: string;
    hostName?: string;
    userAgent: string = "";

    get description(): string {
        return this.userAgent;
    }

    async serialize() {
        return {
            id: this.id,
            platform: this.platform,
            osVersion: this.osVersion,
            appVersion: this.appVersion,
            manufacturer: this.manufacturer,
            model: this.model,
            hostName: this.hostName,
            userAgent: this.userAgent
        };
    }

    async deserialize(raw: any) {
        Object.assign(this, raw);
        return this;
    }
}

export class Session implements Serializable {
    id: string = "";
    account: string = "";
    token?: string;
    created: DateString = new Date().toISOString();
    active: boolean = false;
    lastUsed?: DateString;
    expires?: DateString;
    device: Device = new Device();

    async serialize() {
        return {
            id: this.id,
            account: this.account,
            token: this.token,
            created: this.created,
            active: this.active,
            lastUsed: this.lastUsed,
            expires: this.expires,
            device: this.device && (await this.device.serialize())
        };
    }

    async deserialize(raw: any) {
        await this.device.deserialize(raw.device);
        delete raw.device;
        Object.assign(this, raw);
        return this;
    }
}

export interface PublicAccount {
    id: AccountID;
    email: string;
    name: string;
    publicKey: PublicKey;
}

export class Account implements Storable, PublicAccount {
    kind = "account";
    id: AccountID = "";
    name = "";
    created: DateString = new Date().toISOString();
    updated: DateString = new Date().toISOString();
    mainStore?: StoreID;
    sharedStores: StoreID[] = [];
    publicKey: PublicKey = "";
    privateKey: PrivateKey = "";
    trustedAccounts: PublicAccount[] = [];
    sessions: Session[] = [];
    // TODO
    subscription?: { status: string };
    promo?: any;
    paymentSource?: any;

    constructor(public email: string = "") {}

    get pk() {
        return this.email;
    }

    get publicAccount(): PublicAccount {
        return { id: this.id, email: this.email, publicKey: this.publicKey, name: this.name };
    }

    async serialize() {
        return {
            id: this.id,
            created: this.created,
            updated: this.updated,
            email: this.email,
            name: this.name,
            mainStore: this.mainStore,
            sharedStores: this.sharedStores,
            publicKey: this.publicKey,
            sessions: await Promise.all(this.sessions.map(s => s.serialize()))
        };
    }

    async deserialize(raw: any) {
        this.sessions = ((await Promise.all(
            raw.sessions.map((s: any) => new Session().deserialize(s))
        )) as any) as Session[];
        delete raw.sessions;
        Object.assign(this, raw);
        return this;
    }
}

export enum PrincipalType {
    USER = 'USER',
    WORKER = 'WORKER',
    SERVICE = 'SERVICE',
    UNKNOWN = 'UNKNOWN',
}

export const ALL_PRINICPAL_TYPES = Object.values(PrincipalType)

export enum EndpointScope {
    PLATFORM = 'PLATFORM',
    PROJECT = 'PROJECT',
}

export enum PlatformRole {
    OWNER = 'OWNER',
    MEMBER = 'MEMBER',
}
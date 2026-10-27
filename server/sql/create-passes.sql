CREATE TABLE IF NOT EXISTS passes (
    id UUID PRIMARY KEY,

    name TEXT NOT NULL
        CHECK (length(btrim(name)) > 0),

    document TEXT NOT NULL
        CHECK (length(btrim(document)) > 0),

    issued_at TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    status TEXT NOT NULL
        DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'CANCELLED'))
);
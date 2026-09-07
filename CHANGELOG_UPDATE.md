## IANA Registry Data Updates

### OAuth Access Token Types (oauth_registry/oauth_access_token_types)
- Modified: 1
  - entry_id=PoP
    - additional_token_endpoint_response_parameters: "cnf, rs_cnf (see section 3.1 of RFC8747 and section 3.2 of RFC9201)." → "cnf, rs_cnf (see RFC8747 - Section 3.1 and RFC9201 - Section 3.2)."

### OAuth Dynamic Client Registration Metadata (oauth_registry/oauth_dynamic_client_registration_metadata)
- Added: 22

### PKCE Code Challenge Methods (oauth_registry/pkce_code_challenge_methods)
- Modified: 2
  - entry_id=plain
    - reference: "Section 4.2 of RFC7636" → "RFC7636 - Section 4.2"
  - entry_id=S256
    - reference: "Section 4.2 of RFC7636" → "RFC7636 - Section 4.2"

### OAuth Authorization Server Metadata (oauth_registry/oauth_authorization_server_metadata)
- Added: 2

### JSON Web Token Claims (jwt_registry/json_web_token_claims)
- Added: 4
- Modified: 1
  - entry_id=cmw
    - claim_description: "A RATS Conceptual Message Wrapper" → "RATS Conceptual Message Wrapper"
    - reference: "RFC-ietf-rats-msg-wrap-22 - Sections 3.1, 3.3" → "RFC9999 - Sections 3.1, 3.3"

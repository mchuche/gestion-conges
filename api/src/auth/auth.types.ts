/**
 * Forme de l'utilisateur injecté sur `req.user` après validation JWT (JwtStrategy).
 * Aligné sur ce qu'attend le front (is_admin / is_super_admin).
 */
export type AuthUserPayload = {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  is_super_admin: boolean;
};

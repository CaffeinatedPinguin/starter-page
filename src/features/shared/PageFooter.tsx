/**
 * Barely-there footer signature: the project mark and the author handle,
 * kept deliberately quiet so they never compete with the links.
 */
export function PageFooter() {
  return (
    <footer className="page-footer">
      <img className="page-footer__logo" src="/logo/favicon.svg" alt="" width={18} height={18}/>
      <span className="page-footer__name">smrodek</span>
    </footer>
  );
}

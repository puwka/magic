export const LegalPage = ({
  title,
  updated,
  note,
  children,
}: {
  title: string;
  updated: string;
  note?: React.ReactNode;
  children: React.ReactNode;
}) => {
  return (
    <div className="shell">
      <article className="docs">
        <h1>{title}</h1>
        <p className="docs__meta">Редакция от {updated}</p>
        {note ? <div className="docs__note">{note}</div> : null}
        {children}
      </article>
    </div>
  );
};

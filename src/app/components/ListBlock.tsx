type ListBlockProps = {
  items: string[];
  empty: string;
};

export function ListBlock({ items, empty }: ListBlockProps) {
  if (!items.length) {
    return <p className="muted">{empty}</p>;
  }
  return (
    <ul className="clean-list">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

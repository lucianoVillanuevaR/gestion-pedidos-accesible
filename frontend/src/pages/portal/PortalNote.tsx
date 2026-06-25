type PortalNoteProps = {
  isAccessible: boolean;
  isHighContrast: boolean;
  note: string;
  noteTitle: string;
  softPanelClass: string;
};

function PortalNote({ isAccessible, isHighContrast, note, noteTitle, softPanelClass }: PortalNoteProps) {
  return (
    <section className={`rounded-[26px] p-5 sm:p-6 ${softPanelClass}`}>
      <p className={`font-black ${isAccessible ? "text-2xl" : "text-xl"}`}>{noteTitle}</p>
      <p
        className={`mt-3 max-w-3xl leading-relaxed ${isHighContrast ? "contrast-body-text" : "text-slate-600"} ${isAccessible ? "text-lg" : "text-base"}`}
      >
        {note}
      </p>
    </section>
  );
}

export default PortalNote;

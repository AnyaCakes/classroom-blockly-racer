interface Props {
  onSelectTeacher: () => void;
  onSelectStudent: () => void;
  onSelectPractice: () => void;
}

export function RoleSelectScreen({ onSelectTeacher, onSelectStudent, onSelectPractice }: Props) {
  return (
    <section>
      <h2>Who's joining?</h2>
      <button onClick={onSelectTeacher}>I'm the teacher</button>
      <button onClick={onSelectStudent}>I'm a student</button>
      <button onClick={onSelectPractice}>Just practice</button>
    </section>
  );
}

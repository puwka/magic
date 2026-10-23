import Link from "next/link";

export const FinalCta = () => {
  return (
    <section className="final-cta">
      <div>
        <h2>У хорошего подарка есть своя история.</h2>
        <p>Давайте придумаем её вместе — это займёт всего несколько минут.</p>
      </div>
      <Link className="btn btn--dark" href="/create">
        Подобрать сказку ↗
      </Link>
    </section>
  );
};

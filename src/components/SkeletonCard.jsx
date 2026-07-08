import s from "./SkeletonCard.module.css";

const SkeletonCard = () => {

    return (
        <div className={s.card} aria-hidden="true">

            <div className={`${s.block} ${s.image}`} />

            <div className={s.content}>

                <div className={`${s.block} ${s.title}`} />

                <div className={s.info}>
                    <div className={`${s.block} ${s.pill}`} />
                    <div className={`${s.block} ${s.pill}`} />
                    <div className={`${s.block} ${s.pillWide}`} />
                </div>

                <div className={s.bottom}>
                    <div className={`${s.block} ${s.price}`} />
                    <div className={`${s.block} ${s.link}`} />
                </div>

            </div>

        </div>
    );
};

export const SkeletonGrid = ({ count = 6, gridClassName }) => (
    <div className={gridClassName}>
        {Array.from({ length: count }).map((_, i) => (
            <SkeletonCard key={i} />
        ))}
    </div>
);

export default SkeletonCard;

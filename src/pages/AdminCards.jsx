import { useContext, useEffect } from "react";

import { Link } from "react-router-dom";

import { MyContext } from "../Context";

const AdminCards = () => {

    const {
        properties,
        getCards
    } = useContext(MyContext);

    useEffect(() => {

        getCards();

    }, []);

    return (

        <section>

            <h1>
                Choose Property
            </h1>

            {properties.map((item) => (

                <div key={item.id}>

                    <h2>
                        {item.title}
                    </h2>

                    <Link
                        to={`/admin/changeCard/${item.id}`}
                    >
                        Edit
                    </Link>

                </div>
            ))}

        </section>
    );
};

export default AdminCards;
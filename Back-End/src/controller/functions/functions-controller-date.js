export async function verifier_date(data_start, data_end) {
    try {

        if (!data_start || !data_end) {
            throw new Error("Informações obrigatórias.");
        };

        const data_start_typeDate = new Date(data_start);
        const data_end_typeDate = new Date(data_end);

        if (isNaN(data_end_typeDate) || isNaN(data_start_typeDate)) {
            throw new Error("Informações precisam ser datas.");
        };

        return (data_end_typeDate - data_start_typeDate) / (1000*60*60*24);

    } catch (err) {
        console.error(err);
    };
};
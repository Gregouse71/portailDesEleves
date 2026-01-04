import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import "../../../assets/styles/utilisateur.scss"
import { obtenirQuestionsReponses, modifierQuestionsReponses } from "../../../api/api_utilisateurs";
import { Button, Form, Row, Col } from "react-bootstrap";
import DropdownEditer from "../../elements/DropdownEditer";

export default function TabQuestions({ id, autoriseAModifier }) {
    const queryClient = useQueryClient();
    const [questionsReponses, setQuestionsReponses] = useState({});
    const [isGestion, setIsGestion] = useState(false);

    const { data: questionData } = useQuery({
        queryKey: ['questionsReponses', id],
        queryFn: () => obtenirQuestionsReponses(id),
    });

    useEffect(() => {
        if (questionData) { setQuestionsReponses(questionData) };
    }, [questionData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setQuestionsReponses({ ...questionsReponses, [name]: value })
    };

    const mutation = useMutation({
        mutationFn: async () => {
            await modifierQuestionsReponses(id, questionsReponses);
            return obtenirQuestionsReponses(id); // fetch updated data
        },
        onSuccess: (updatedQuestions) => {
            queryClient.setQueryData(['questionsReponses', id], updatedQuestions);
            setQuestionsReponses(updatedQuestions);
            setIsGestion(false);
        }
    });

    return (<>
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h2>Un peu plus sur moi</h2>
            <div className="ms-auto d-flex align-items-center gap-2 flex-shrink-0 ps-3">
                {autoriseAModifier && <DropdownEditer list={[
                    { can: true, onClick: () => setIsGestion(!isGestion), name: "Modifier" },
                ]}
                />}
            </div>
        </div>

        {!isGestion ?
            <div class="list-question">
                {Object.keys(questionsReponses).map(key => {
                    return (<div key={key}><strong>{key.slice(3, -1)} :</strong> {questionsReponses[key]}</div>)
                })}
            </div>
            :
            <Form>
                {Array.from(Object.keys(questionsReponses)).sort().map(key => {
                    return (
                        <Form.Group as={Row} className="mb-3" key={key}>
                            <Form.Label column sm="4">{key.slice(3, -1)}</Form.Label>
                            <Col sm="8">
                                <Form.Control type="text" name={key} value={questionsReponses[key]} onChange={handleChange} />
                            </Col>
                        </Form.Group>
                    )
                })}
                <div className="d-flex gap-2">
                    <Button variant="success" onClick={mutation.mutate}>Valider</Button>
                    <Button variant="danger" onClick={() => setIsGestion(false)}>Annuler</Button>
                </div>
            </Form>}
    </>)
}
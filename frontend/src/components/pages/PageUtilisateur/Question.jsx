import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { obtenirQuestionsReponses, modifierQuestionsReponses } from "../../../api/api_utilisateurs";
import { Button, Form, Row, Col } from "react-bootstrap";
import DropdownEditer from "../../elements/DropdownEditer";
import OngletTemplate from "../../templates/ongletTab";
import Chargement from "../../elements/Chargement";

export default function TabQuestions({ id, autoriseAModifier }) {
    const queryClient = useQueryClient();
    const [isGestion, setIsGestion] = useState(false);

    const { data: questionData = {}, isLoading } = useQuery({
        queryKey: ['questionsReponses', id],
        queryFn: () => obtenirQuestionsReponses(id),
    });

    const [questionsReponses, setQuestionsReponses] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setQuestionsReponses({ ...questionsReponses, [name]: value })
    };

    const handleToggleGestion = () => {
        if (!isGestion) {
            setQuestionsReponses(questionData);
        }
        setIsGestion(!isGestion);
    };

    const mutation = useMutation({
        mutationFn: async () => {
            await modifierQuestionsReponses(id, questionsReponses);
            return obtenirQuestionsReponses(id); // fetch updated data
        },
        onSuccess: (updatedQuestions) => {
            queryClient.setQueryData(['questionsReponses', id], updatedQuestions);
            setIsGestion(false);
        }
    });

    if (isLoading) return <Chargement/>

    const displayData = isGestion ? questionsReponses : questionData;

    return <OngletTemplate
        titre="Un peu plus sur moi"
        avecDropdown={autoriseAModifier} contenuDropdown={[
            { can: true, onClick: handleToggleGestion, name: "Modifier" },
        ]}
        contenu={!isGestion ?
            <div className="list-question">
                {Object.keys(displayData).map(key => {
                    return (<div key={key}><strong>{key.slice(3)}</strong> {displayData[key]}</div>)
                })}
            </div>
            :
            <Form>
                {Array.from(Object.keys(displayData)).sort().map(key => {
                    return (
                        <Form.Group as={Row} className="mb-1" key={key}>
                            <Form.Label column sm="4">{key.slice(3)}</Form.Label>
                            <Col sm="8">
                                <Form.Control type="text" name={key} value={displayData[key] || ""} onChange={handleChange} />
                            </Col>
                        </Form.Group>
                    )
                })}
                <div className="d-flex gap-2">
                    <Button variant="success" onClick={mutation.mutate}>Valider</Button>
                    <Button variant="danger" onClick={() => setIsGestion(false)}>Annuler</Button>
                </div>
            </Form>
        }
    />;
}
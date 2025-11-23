import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createBatch } from '../../api/batches';
import PageContainer from '../../components/PageContainer';
import BatchForm from '../../components/BatchForm';

export default function NewBatch() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createBatch,
    onSuccess: () => {
      toast.success('Batch submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      navigate('/exporter');
    },
    onError: (error) => {
      const message =
        error.response?.data?.error?.message ||
        'Could not submit batch. Try again.';
      toast.error(message);
    },
  });

  return (
    <PageContainer
      title="Submit new batch"
      description="Provide product details and attach any lab or packaging documents."
    >
      <BatchForm onSubmit={mutation.mutateAsync} isSubmitting={mutation.isPending} />
    </PageContainer>
  );
}





import React, { useEffect, useState } from 'react';
import { FormikProvider, useFormik, Form } from 'formik';
import { useIntl } from 'react-intl';
import { useSelector, useDispatch } from 'react-redux';
import { useMutation } from 'react-query';

import {
  CheckPagePermissions,
  ConfirmDialog,
  SettingsPageTitle,
  useAPIErrorHandler,
  useFetchClient,
  useNotification,
} from '@strapi/helper-plugin';
import { Button, ContentLayout, HeaderLayout, Layout, Loader, Main } from '@strapi/design-system';
import { Check } from '@strapi/icons';

import { Stages } from './components/Stages';
import { reducer, initialState } from './reducer';
import { REDUX_NAMESPACE } from './constants';
import { useInjectReducer } from '../../../../../../admin/src/hooks/useInjectReducer';
import { useReviewWorkflows } from './hooks/useReviewWorkflows';
import { setWorkflows } from './actions';
import { getWorkflowValidationSchema } from './utils/getWorkflowValidationSchema';
import adminPermissions from '../../../../../../admin/src/permissions';

export function ReviewWorkflowsPage() {
  const { formatMessage } = useIntl();
  const { put } = useFetchClient();
  const toggleNotification = useNotification();
  const { formatAPIError } = useAPIErrorHandler();
  const dispatch = useDispatch();
  const { workflows: workflowsData, refetchWorkflow } = useReviewWorkflows();
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);

  const {
    status,
    clientState: {
      currentWorkflow: {
        data: currentWorkflow,
        isDirty: currentWorkflowIsDirty,
        hasDeletedServerStages: currentWorkflowHasDeletedServerStages,
      },
    },
  } = useSelector((state) => state?.[REDUX_NAMESPACE] ?? initialState);

  const { isLoading: mutationIsLoading, mutateAsync } = useMutation(
    async ({ workflowId, stages }) => {
      const {
        data: { data },
      } = await put(`/admin/review-workflows/workflows/${workflowId}/stages`, {
        data: stages,
      });

      return data;
    },
    {
      async onError(error) {
        toggleNotification({
          type: 'warning',
          message: formatAPIError(error),
        });
      },

      async onSuccess() {
        toggleNotification({
          type: 'success',
          message: { id: 'notification.success.saved', defaultMessage: 'Saved' },
        });
      },
    }
  );

  const updateWorkflowStages = (workflowId, stages) => {
    return mutateAsync({ workflowId, stages });
  };

  const submitForm = async () => {
    try {
      await updateWorkflowStages(currentWorkflow.id, currentWorkflow.stages);
      refetchWorkflow();
    } catch (error) {
      // silence
    } finally {
      setIsConfirmDeleteDialogOpen(false);
    }
  };

  const handleConfirmDeleteDialog = async () => {
    await submitForm();
  };

  const toggleConfirmDeleteDialog = () => {
    setIsConfirmDeleteDialogOpen((prev) => !prev);
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: currentWorkflow,
    async onSubmit() {
      if (currentWorkflowHasDeletedServerStages) {
        setIsConfirmDeleteDialogOpen(true);
      } else {
        submitForm();
      }
    },
    validationSchema: getWorkflowValidationSchema({ formatMessage }),
    validateOnChange: false,
  });

  useInjectReducer(REDUX_NAMESPACE, reducer);

  useEffect(() => {
    dispatch(setWorkflows({ status: workflowsData.status, data: workflowsData.data }));
  }, [workflowsData.status, workflowsData.data, dispatch]);

  return (
    <CheckPagePermissions permissions={adminPermissions.settings['review-workflows'].main}>
      <Layout>
        <SettingsPageTitle
          name={formatMessage({
            id: 'Settings.review-workflows.page.title',
            defaultMessage: 'Review Workflows',
          })}
        />
        <Main tabIndex={-1}>
          <FormikProvider value={formik}>
            <Form onSubmit={formik.handleSubmit}>
              <HeaderLayout
                primaryAction={
                  <Button
                    startIcon={<Check />}
                    type="submit"
                    size="M"
                    disabled={!currentWorkflowIsDirty}
                  >
                    {formatMessage({
                      id: 'global.save',
                      defaultMessage: 'Save',
                    })}
                  </Button>
                }
                title={formatMessage({
                  id: 'Settings.review-workflows.page.title',
                  defaultMessage: 'Review Workflows',
                })}
                subtitle={formatMessage(
                  {
                    id: 'Settings.review-workflows.page.subtitle',
                    defaultMessage: '{count, plural, one {# stage} other {# stages}}',
                  },
                  { count: currentWorkflow?.stages?.length ?? 0 }
                )}
              />
              <ContentLayout>
                {status === 'loading' && (
                  <Loader>
                    {formatMessage({
                      id: 'Settings.review-workflows.page.isLoading',
                      defaultMessage: 'Workflow is loading',
                    })}
                  </Loader>
                )}

                <Stages stages={formik.values?.stages} />
              </ContentLayout>
            </Form>
          </FormikProvider>

          <ConfirmDialog
            bodyText={{
              id: 'Settings.review-workflows.page.delete.confirm.body',
              defaultMessage:
                'All entries assigned to deleted stages will be moved to the first stage. Are you sure you want to save this?',
            }}
            isConfirmButtonLoading={mutationIsLoading}
            isOpen={isConfirmDeleteDialogOpen}
            onToggleDialog={toggleConfirmDeleteDialog}
            onConfirm={handleConfirmDeleteDialog}
          />
        </Main>
      </Layout>
    </CheckPagePermissions>
  );
}
